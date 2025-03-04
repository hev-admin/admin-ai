import { hash } from 'bcrypt';
import sequelize from '../config/database.js';

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  // 创建管理员用户
  const hashedPassword = await hash('admin123', 10);
  await queryInterface.bulkInsert('users', [{
    username: 'admin',
    password: hashedPassword,
    email: 'admin@example.com',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  }]);
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  // 删除所有用户数据
  await queryInterface.bulkDelete('users', null, {});
}

export { up, down };
