import mongoose, { Schema, Model, Document } from "mongoose";
import { IUser } from "./UserModel";

interface IComment extends Document {
  user: IUser;
  comment: string;
  commentReplies?: IComment[];
}

export interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies?: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: Object;
  videoDuration: number;
  videoSection: string;
  videoPlayer: string;
  questions: IComment[];
  suggestion: string;
  links: ILink[];
}

interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: { public_id: string; url: string };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  ratings: number;
  courseData: ICourseData[];
  purchased?: number;
}

const commentSchema = new Schema<IComment>(
  {
    user: Object,
    comment: String,
    commentReplies: [Object],
  },
  {
    timestamps: true,
  }
);

const reviewSchema = new Schema<IReview>(
  {
    user: Object,
    rating: {
      type: Number,
      default: 0,
    },
    comment: String,
    commentReplies: [Object],
  },
  { timestamps: true }
);

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoThumbnail: Object,
  videoDuration: Number,
  videoSection: String,
  videoPlayer: String,
  questions: [commentSchema],
  suggestion: String,
  links: [linkSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedPrice: Number,
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    tags: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    ratings: {
      type: Number,
      default: 0,
    },
    courseData: [courseDataSchema],
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;
