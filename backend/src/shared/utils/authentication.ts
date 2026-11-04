import jwt from "jsonwebtoken";
import { Response } from "commoneventframework";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import { AppDataSource } from "../../data-source.js";
import { User } from "../../users/user.entity.js";
import type { UserRole } from "../../users/user.entity.js";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

export type AuthenticationResult =
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: Response };
  // type representing either a successfully authenticated user or an authentication failure response


//Only allows logged in users to use the handlers/routes
export async function authenticate(
  event: CommonEvent,
): Promise<AuthenticationResult> {
  const cookieName = process.env.ACCESS_TOKEN_NAME;
  const secret = process.env.JWT_SECRET_ACCESS;
  if (!cookieName || !secret) {
    throw new Error("Access-token cookie name or secret is not configured");
  }
  //its good to have a token name this can allow more flexibity to handle new future tokens like a refresh token
  //this checks if the access token cookie name and secret are in the env 

  const token = readCookie(event, cookieName);
  if (!token) {
    return { response: new Response(401, { message: "Authentication required" }) };
  }// if no token is found return unauthorized response

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return {
      response: new Response(401, { message: "Invalid or expired access token" }),
    };
  }// if the token is invalid or expired return unauthorized response

  if (typeof payload === "string" || typeof payload.userId !== "string") {
    return { response: new Response(401, { message: "Invalid access token" }) };
  }// if the payload is not as expected return unauthorized response

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: payload.userId },
  });//finds the user with id in the db.
  if (!user) {
    return { response: new Response(401, { message: "User not found" }) }; // if not the user is not found.
  }

  return { user: { id: user.id, role: user.role } };
}

export function roleError(role: UserRole): Response {
  return new Response(403, {
    message: `Only ${role.toLowerCase()}s can perform this action`,
  });
} // function displaying a role error message


// function to create an access token cookie
// storing the access token in an HttpOnly cookie for secure client-side storage
//safer than storing it in localStorage
export function createAccessTokenResponse(
  status: number,
  body: object,
  userId: string,
): Response {
  const cookieName = process.env.ACCESS_TOKEN_NAME;
  const secret = process.env.JWT_SECRET_ACCESS;
  if (!cookieName || !secret) {
    throw new Error("Access-token cookie name or secret is not configured");
  }

  const expiresInSeconds = 2 * 60 * 60; // 2 hours in seconds (so you guys can test more easily)
  const token = jwt.sign({ userId }, secret, { expiresIn: expiresInSeconds });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${expiresInSeconds}${secure}`;
  // The JWT goes in an HttpOnly cookie, not localStorage: JavaScript can't read it,
  // so an XSS bug can't steal the token. SameSite=Strict stops the browser sending it
  // on cross-site requests (CSRF protection). Secure is added in production (HTTPS only).

  return new Response(status, body, { "Set-Cookie": cookie });
}

//function to clear the access token cookie. For users that logout
export function clearAccessTokenResponse(): Response {
  const cookieName = process.env.ACCESS_TOKEN_NAME;
  if (!cookieName) {
    throw new Error("ACCESS_TOKEN_NAME is not configured");
  }
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`; // Max-Age=0 makes the browser delete the cookie.
  return new Response(204, {}, { "Set-Cookie": cookie });
}

function readCookie(event: CommonEvent, cookieName: string): string | undefined {
  const cookieValue = event.cookies?.[cookieName];
  if (cookieValue) {
    return cookieValue;
  }

  
  //fallback function to collect access token from the cookie header if not found in event.cookies (incase CEF cookies dont work)
  //You dont want a user to be logged out because this potentional issue.
  const cookieHeader = Object.entries(event.headers ?? {}).find(
    ([name]) => name.toLowerCase() === "cookie",
  )?.[1];
  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== cookieName) {
      continue;
    }
    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}
