import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  Column,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { FileMetadata } from './file-metadata.entity';
import { Blog } from '../../../blogs/domain/entities/blog.entity';

@Entity()
export class BlogImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Blog, (blog) => blog.images)
  @JoinColumn()
  blog: Blog;
  @Column('uuid')
  blogId: string;

  @OneToMany(() => FileMetadata, (image) => image.blogImage)
  images: FileMetadata[];

  setBlogId(blogId: string) {
    this.blogId = blogId;
  }
}
