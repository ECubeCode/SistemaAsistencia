const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const dni = process.env.ADMIN_DNI;
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE || "Administrador";
  const apellido = process.env.ADMIN_APELLIDO || "Sistema";

  if (!dni || !password) {
    console.log(
      "[seed] ADMIN_DNI / ADMIN_PASSWORD no configurados, se omite la creación del admin inicial."
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { dni } });
  if (existing) {
    console.log(`[seed] Ya existe un usuario con DNI ${dni}, no se realizan cambios.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { dni, nombre, apellido, passwordHash, role: "ADMIN" },
  });
  console.log(`[seed] Usuario admin creado con DNI ${dni}.`);
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
