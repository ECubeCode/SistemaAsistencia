-- CreateTable
CREATE TABLE "CancelledClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "reason" TEXT,
    "cancelledById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CancelledClass_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ALUMNO',
    "selfPasswordChangeUsed" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("active", "apellido", "createdAt", "dni", "id", "nombre", "passwordHash", "role", "selfPasswordChangeUsed", "updatedAt") SELECT "active", "apellido", "createdAt", "dni", "id", "nombre", "passwordHash", "role", "selfPasswordChangeUsed", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CancelledClass_date_key" ON "CancelledClass"("date");

-- CreateIndex
CREATE INDEX "CancelledClass_date_idx" ON "CancelledClass"("date");

