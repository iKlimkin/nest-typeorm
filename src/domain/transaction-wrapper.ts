import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export async function runInTransaction<T>(
  dataSource: DataSource,
  operation: (manager: EntityManager) => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const manager = queryRunner.manager;
  
  await queryRunner.startTransaction();

  try {
    const result = await operation(manager);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
