// Add only explicitly approved A-Level users. Keep keys as normalised emails.
export const A_LEVEL_USERS = Object.freeze({});

const SUPPORTED_ROLES = new Set(["viewer", "admin"]);

export const LOCAL_A_LEVEL_PRINCIPAL = Object.freeze({
  email: "local-founder-qa@localhost.invalid",
  code: "local-founder-qa",
  label: "Local founder QA",
  role: "admin"
});

export function principalFromAccess(data, users = A_LEVEL_USERS) {
  const claimedEmail = data?.cloudflareAccess?.JWT?.payload?.email;
  if (typeof claimedEmail !== "string") {
    return null;
  }

  const email = claimedEmail.trim().toLowerCase();
  const user = users[email];
  if (!email
    || !user
    || typeof user.code !== "string"
    || typeof user.label !== "string"
    || !SUPPORTED_ROLES.has(user.role)) {
    return null;
  }

  return {
    email,
    code: user.code,
    label: user.label,
    role: user.role
  };
}
