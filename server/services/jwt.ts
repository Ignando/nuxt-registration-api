import { sign, verify, type SignOptions, type Secret, type JwtPayload } from "jsonwebtoken";

type JwtTimeSpan = `${number}${"ms" | "s" | "m" | "h" | "d"}` | number;

const SECRET: Secret = (process.env.JWT_SECRET ?? "dev-secret-change-me") as Secret;

export function signJwt(payload: object, ttl: JwtTimeSpan = "7d"): string {
    const opts: SignOptions = { expiresIn: ttl };
    return sign(payload, SECRET, opts);
}

export function verifyJwt<T extends object = JwtPayload>(token: string): T {
    return verify(token, SECRET) as T
}