from passlib.context import CryptContext
import bcrypt

print(f"Bcrypt version: {bcrypt.__version__}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = pwd_context.hash("testpassword")
print(f"Hash generated: {hash}")

verify = pwd_context.verify("testpassword", hash)
print(f"Verification result: {verify}")
