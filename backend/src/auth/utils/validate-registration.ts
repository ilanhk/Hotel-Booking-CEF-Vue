export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationValidation =
  | { valid: true; value: RegistrationInput }
  | { valid: false; message: string };

export function validateRegistrationInput(input: unknown): RegistrationValidation {
  
  if (typeof input !== "object" || input === null) {
    return { valid: false, message: "A registration object is required" };
  } //Rejects non-objects, null and arrays.

  const fields = input as Record<string, unknown>;
  if (
    typeof fields.name !== "string" ||
    typeof fields.email !== "string" ||
    typeof fields.password !== "string"
  ) {
    return { valid: false, message: "Name, email, and password are required" };
  } //checks that name, email, and password are strings

  // Trim extra spaces from name and email and make sures email is in lowercase
  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const password = fields.password;

  //Make sure the name is within the range of 1 to 120 characters
  if (name.length < 1 || name.length > 120) {
    return { valid: false, message: "Name must be between 1 and 120 characters" };
  }
  //make sure the email is a valid email address
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: "Enter a valid email address" };
  }
  //Make sure the password meets the requirements:
  //- At least 8 characters and no more than 128 characters
  //- At least one lowercase letter
  //- At least one uppercase letter
  //- At least one number
  //- At least one special character
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return {
      valid: false,
      message:
        "Password must be 8-128 characters and include an uppercase letter, lowercase letter, number, and symbol",
    };
  }

  return { valid: true, value: { name, email, password } };
  //When all fields are valid, it returns valid: true and the cleaned name, email and password.
}
