import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../../posts/domain/entities/post.entity';
import { FileMetadata } from './file-metadata.entity';

@Entity()
export class PostImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Post, (post) => post.mainImages)
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;

  @OneToMany(() => FileMetadata, (image) => image.postImage)
  mainImages: FileMetadata[];

  setPostId(postId: string) {
    this.postId = postId;
  }
}
