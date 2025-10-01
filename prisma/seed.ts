import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Criar role MASTER (não deletável, com staffStatus)
  let masterRole = await prisma.role.findUnique({ where: { name: 'MASTER' } });
  if (!masterRole) {
    masterRole = await prisma.role.create({
      data: {
        name: 'MASTER',
        description: 'Role principal do sistema - não pode ser deletada',
        isDeletable: false,
        staffStatus: true, // Acesso total ao sistema
      },
    });
    console.log('✅ Role MASTER criada:', masterRole);
  } else {
    console.log('⚠️ Role MASTER já existe');
  }

  // 2. Criar roles padrão (ADMIN e USER)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador do sistema',
      isDeletable: true,
      staffStatus: true, // Staff tem acesso a todos os dados
    },
  });
  console.log('✅ Role ADMIN:', adminRole);

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Usuário comum',
      isDeletable: true,
      staffStatus: false, // Usuário comum só vê seus próprios dados
    },
  });
  console.log('✅ Role USER:', userRole);

  // 3. Criar primeiro usuário MASTER
  const email = 'fernando@ptec.dev';
  const username = 'fernando.magalhaes';
  const password = 'qweasd32';

  const exists = await prisma.user.findUnique({ where: { email } });

  if (!exists) {
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'Fernando Magalhães',
        username,
        email,
        passwordHash: hash,
        roleId: masterRole.id,
      },
    });

    console.log('✅ Usuário MASTER criado:', user);
  } else {
    console.log('⚠️ Usuário já existe, nada feito.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
