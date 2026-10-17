try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignorar si no existe el archivo .env
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

async function deleteStudentByDni(dniInput) {
  const dni = String(dniInput || "").trim();
  if (!dni) {
    console.log("Error: Debes especificar un DNI. Uso: delete <dni>");
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { dni } });

    if (!user) {
      console.log(`Error: No se encontró ningún usuario con el DNI ${dni}.`);
      return;
    }

    if (user.role !== "ALUMNO") {
      console.log(
        `Error: El usuario con DNI ${dni} (${user.apellido}, ${user.nombre}) es ${user.role}. Solo se pueden eliminar alumnos.`
      );
      return;
    }

    await prisma.auditLog.create({
      data: {
        action: "USER_DELETED",
        targetId: user.id,
        details: `Alumno ${user.apellido}, ${user.nombre} (DNI: ${dni}) eliminado via CLI`,
      },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(
      `✓ Alumno ${user.apellido}, ${user.nombre} (DNI: ${dni}) fue eliminado correctamente.`
    );
  } catch (err) {
    console.error("Error al intentar eliminar el alumno:", err.message || err);
  }
}

async function resetPassword(dniInput, newPasswordInput) {
  const dni = String(dniInput || "").trim();
  if (!dni) {
    console.log("Error: Debes especificar un DNI. Uso: reset-password <dni> [nueva_clave]");
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { dni } });
    if (!user) {
      console.log(`Error: No se encontró ningún usuario con el DNI ${dni}.`);
      return;
    }

    // Si no se especifica una nueva clave, se usa el mismo DNI por defecto
    const newPassword = String(newPasswordInput || dni).trim();
    if (newPassword.length < 4) {
      console.log("Error: La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        selfPasswordChangeUsed: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "USER_UPDATED",
        targetId: user.id,
        details: `Contraseña restablecida vía CLI para ${user.role} ${user.apellido}, ${user.nombre} (DNI: ${dni})`,
      },
    });

    console.log(
      `✓ Contraseña de ${user.apellido}, ${user.nombre} (${user.role}, DNI: ${dni}) restablecida exitosamente.`
    );
  } catch (err) {
    console.error("Error al restablecer la contraseña:", err.message || err);
  }
}

async function listUsers(filterInput) {
  try {
    const filter = String(filterInput || "").trim().toUpperCase();
    const where = {};
    if (["ALUMNO", "PROFESOR", "ADMIN"].includes(filter)) {
      where.role = filter;
    } else if (filter) {
      where.OR = [
        { nombre: { contains: filter } },
        { apellido: { contains: filter } },
        { dni: { contains: filter } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { apellido: "asc" }, { nombre: "asc" }],
      select: { dni: true, nombre: true, apellido: true, role: true, active: true },
    });

    if (users.length === 0) {
      console.log("No se encontraron usuarios.");
      return;
    }

    console.log(`\nUsuarios registrados (${users.length}):`);
    for (const u of users) {
      console.log(`  - [${u.role}] DNI: ${u.dni} | ${u.apellido}, ${u.nombre} (${u.active ? "Activo" : "Inactivo"})`);
    }
    console.log("");
  } catch (err) {
    console.error("Error al listar usuarios:", err.message || err);
  }
}

function showHelp() {
  console.log("\nComandos disponibles en la consola:");
  console.log("  reset-password <dni> [clave]  Restablece la contraseña de un usuario (alumno, profesor o admin). Si no se pasa clave, usa su DNI.");
  console.log("  list [filtro]                 Lista usuarios por rol (ALUMNO, PROFESOR, ADMIN) o buscando por nombre/apellido.");
  console.log("  delete <dni>                  Borra al alumno con el DNI especificado.");
  console.log("  help                          Muestra esta ayuda.");
  console.log("  exit / quit                   Sale de la consola.\n");
}

async function handleCommand(input) {
  const line = input.trim();
  if (!line) return true;

  const parts = line.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (command === "delete") {
    await deleteStudentByDni(args[0]);
  } else if (command === "reset-password" || command === "password" || command === "passwd") {
    await resetPassword(args[0], args[1]);
  } else if (command === "list" || command === "list-users" || command === "find") {
    await listUsers(args[0]);
  } else if (command === "help") {
    showHelp();
  } else if (command === "exit" || command === "quit") {
    return false;
  } else {
    console.log(`Comando desconocido: "${command}". Escribe "help" para ver los comandos disponibles.`);
  }

  return true;
}

async function startInteractive() {
  console.log("=== Consola de Administración (Asistencia CLI) ===");
  console.log('Escribe "help" para ver la lista de comandos disponibles, o "exit" para salir.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "asistencia-cli> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const shouldContinue = await handleCommand(line);
    if (!shouldContinue) {
      rl.close();
      return;
    }
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Saliendo de la consola.");
    prisma.$disconnect().then(() => process.exit(0));
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    const command = args[0].toLowerCase();
    if (command === "delete") {
      await deleteStudentByDni(args[1]);
    } else if (command === "reset-password" || command === "password" || command === "passwd") {
      await resetPassword(args[1], args[2]);
    } else if (command === "list" || command === "list-users" || command === "find") {
      await listUsers(args[1]);
    } else if (command === "help") {
      showHelp();
    } else {
      console.log(`Comando desconocido: "${command}". Uso: npm run cli [reset-password|list|delete|help]`);
    }
    await prisma.$disconnect();
  } else {
    await startInteractive();
  }
}

main().catch((err) => {
  console.error("Error fatal en CLI:", err);
  prisma.$disconnect().then(() => process.exit(1));
});
