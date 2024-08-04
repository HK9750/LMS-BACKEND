import mongoose, { Document, Schema, Model } from "mongoose";

interface FaqItem extends Document {
  question: string;
  answer: string;
}

interface Category extends Document {
  title: string;
}

interface BannerImage extends Document {
  public_id: string;
  url: string;
}

interface Layout extends Document {
  type: string;
  faq: FaqItem[];
  categories: Category[];
  banner: {
    image: BannerImage;
    title: string;
    subtitle: string;
  };
}

const FaqItemSchema = new Schema({
  question: { type: String },
  answer: { type: String },
});

const CategorySchema = new Schema({
  title: { type: String },
});

const BannerImageSchema = new Schema({
  public_id: { type: String },
  url: { type: String },
});

const LayoutSchema: Schema<Layout> = new Schema({
  type: { type: String },
  faq: [FaqItemSchema],
  categories: [CategorySchema],
  banner: {
    image: BannerImageSchema,
    title: { type: String },
    subtitle: { type: String },
  },
});

const LayoutModel: Model<Layout> = mongoose.model("Layout", LayoutSchema);

export default LayoutModel;
