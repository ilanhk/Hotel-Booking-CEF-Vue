import { Response } from "commoneventframework";
import { AppDataSource } from "../../data-source.js";
import { validateRegistrationInput } from "../utils/validate-registration.js";
import { hashPassword, verifyPassword } from "../utils/password-hashing.js";
import { User } from "../../users/user.entity.js";
import {
  authenticate,
  clearAccessTokenResponse,
  createAccessTokenResponse,
} from "../../shared/utils/authentication.js";
import { isRecord } from "../../shared/utils/request.js";
import type { HandlerFn } from "../../shared/types.js";

export const register: HandlerFn = async (input) => {
  const validation = validateRegistrationInput(input); // vaildation for name, email and password
  if (!validation.valid) {
    return new Response(400, { message: validation.message }); //If not valid a bad request response is sent with the message from the validation function
  }
  const { name, email, password } = validation.value; //gets the cleaned name, email and password

  try {
    const repository = AppDataSource.getRepository(User);
    if (await repository.exists({ where: { email } })) {
      return new Response(409, { message: "User already exists" });
    } // checks if a user with the given email already exists

    const user = await repository.save(
      repository.create({
        name,
        email,
        password: await hashPassword(password),
      }), // creates a new user in the DB
    );
    return createAccessTokenResponse(
      201,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      user.id,
    ); //create access token and save it in a cookie for the new user (safer than local storage)
  } catch (error: unknown) {
    if (isDuplicateEmailError(error)) {
      return new Response(409, { message: "User already exists" });
    } //makes sure if 2 users try to register with the same email at the same time, only one succeeds while the other gets a conflict error.
    console.error("Failed to register user", error);
    return new Response(500, { error: "Internal server error" }); //handles any server errors that occur during registration.
  }
};

export const login: HandlerFn = async (input) => {
  if (
    !isRecord(input) ||
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    !input.email ||
    !input.password
  ) {
    return new Response(400, { message: "Email and password are required" });
  }
  //checks if email and password are provided and are of type string. 
  // If not a bad request error will be sent

  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", {
        email: input.email.trim().toLowerCase(),
      })
      .getOne();
      //finds the user with the given email

    if (!user || !(await verifyPassword(input.password, user.password))) {
      return new Response(401, { message: "Invalid email or password" });
    }
    //if the user doesnt exist or the password is incorrect it returns an unauthorized error
    return createAccessTokenResponse(
      200,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      user.id,
    ); //creates an access token and saves it in a cookie.
  } catch (error: unknown) {
    console.error("Failed to log in", error);
    return new Response(500, { error: "Internal server error" });
  }// catches any server errors that occur during login
};

// Lets the frontend restore the session after a page refresh (the JWT is in an HttpOnly cookie,
// so JavaScript can't read it and has to ask the server who is logged in).
export const me: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  try {
    const user = await AppDataSource.getRepository(User).findOneByOrFail({
      id: authentication.user.id,
    });
    return new Response(200, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: unknown) {
    console.error("Failed to load current user", error);
    return new Response(500, { error: "Internal server error" });
  }
};

export const logout: HandlerFn = async () => {
  try {
    return clearAccessTokenResponse();//clears the access token cookie to log the user out
  } catch (error: unknown) {
    console.error("Failed to log out", error);
    return new Response(500, { error: "Internal server error" });
  }// catches any server errors that occur during logout
};


//again handles a situation where 2 users try to register with the same email at the same time, ensuring only one succeeds.
function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
