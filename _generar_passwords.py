import hashlib, secrets, string

def gen_password(length=10):
    chars = string.ascii_letters + string.digits
    while True:
        pwd = ''.join(secrets.choice(chars) for _ in range(length))
        if (any(c.isupper() for c in pwd) and
            any(c.islower() for c in pwd) and
            any(c.isdigit() for c in pwd)):
            return pwd

def sha256(p):
    return hashlib.sha256(p.encode()).hexdigest()

usuarios = {
    'jorge':  gen_password(),
    'daniel': gen_password(),
}

print('=== CONTRASEÑAS ===')
for u, p in usuarios.items():
    print(f'  {u:10} ->  {p}')

print()
print('=== COPIAR EN STREAMLIT CLOUD SECRETS ===')
print('[usuarios]')
for u, p in usuarios.items():
    print(f'{u} = "{sha256(p)}"')
