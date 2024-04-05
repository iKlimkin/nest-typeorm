import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateBlogModelType } from '../../api/models/input.blog.models/create.blog.model';
import { validateOrReject } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { BlogViewModelType } from '../../api/models/output.blog.models/blog.view.model-type';

export type BlogDocument = HydratedDocument<Blog>;
export type BlogModelType = Model<BlogDocument> & StaticsType;
export type BlogWholeModelTypes = BlogModelType & MethodsType;

@Schema({ _id: false })
export class Blog {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  websiteUrl: string;

  @Prop({ required: true, type: String })
  createdAt: string;

  @Prop({ required: true, type: Boolean, default: false })
  isMembership: boolean;

  static async makeInstance(dto: CreateBlogModelType): Promise<BlogDocument> {
    const blog = new this() as BlogDocument;

    blog._id = new Types.ObjectId();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.createdAt = new Date().toISOString();
    blog.isMembership = false;

    try {
      await validateOrReject(blog);
    } catch (error) {
      throw new BadRequestException();
    }

    return blog;
  }

  getBlogsViewModel(blogModel: BlogDocument): BlogViewModelType {
    return {
      id: blogModel._id.toString(),
      name: blogModel.name,
      description: blogModel.description,
      websiteUrl: blogModel.websiteUrl,
      createdAt: blogModel.createdAt,
      isMembership: blogModel.isMembership,
    };
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

const blogStatics = {
  makeInstance: Blog.makeInstance,
};
const blogMethods = {
  getBlogsViewModel: Blog.prototype.getBlogsViewModel,
};

type StaticsType = typeof blogStatics;
type MethodsType = typeof blogMethods;

BlogSchema.statics = blogStatics;
BlogSchema.methods = blogMethods;
