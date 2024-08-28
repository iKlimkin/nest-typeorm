import { EntityManager } from 'typeorm';

export class BaseRepository {
  async saveEntity<T>(entity: T, manager: EntityManager): Promise<T> {
    try {
      return await manager.save(entity);
    } catch (error) {
      console.log(error);
      throw new Error(`entity is not saved: ${error}`);
    }
  }
}
