import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import LayoutModel from "../Models/LayoutModel";
import cloudinary from "cloudinary";

const uploadImageToCloudinary = async (image: string) => {
  const cloudImage = await cloudinary.v2.uploader.upload(image, {
    folder: "bannerImages",
    width: 1140,
    height: 400,
  });
  return {
    public_id: cloudImage.public_id,
    url: cloudImage.secure_url,
  };
};

const destroyImageFromCloudinary = async (public_id: string) => {
  await cloudinary.v2.uploader.destroy(public_id);
};

const createBannerLayout = async (req: Request) => {
  const { image, title, subtitle } = req.body;
  const uploadedImage = await uploadImageToCloudinary(image);
  return {
    type: "Banner",
    banner: {
      image: uploadedImage,
      title,
      subtitle,
    },
  };
};

const createCategoriesLayout = (req: Request) => {
  const { categories } = req.body;
  const categoriesItems = categories.map((item: any) => ({
    title: item.title,
  }));
  return {
    type: "Categories",
    categories: categoriesItems,
  };
};

const createFAQLayout = (req: Request) => {
  const { faq } = req.body;
  const faqItems = faq.map((item: any) => ({
    question: item.question,
    answer: item.answer,
  }));
  return {
    type: "FAQ",
    faq: faqItems,
  };
};

export const createLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeExist = await LayoutModel.findOne({ type });
      if (isTypeExist) {
        return next(new ErrorHandler("Layout already exists", 400));
      }
      let layoutData;
      switch (type) {
        case "Banner":
          layoutData = await createBannerLayout(req);
          break;
        case "Categories":
          layoutData = createCategoriesLayout(req);
          break;
        case "FAQ":
          layoutData = createFAQLayout(req);
          break;
        default:
          return next(new ErrorHandler("Invalid layout type", 400));
      }

      const layout = await LayoutModel.create(layoutData);
      res.status(201).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await LayoutModel.findOne({ type });
      if (!layout) {
        return next(new ErrorHandler("Layout not found", 404));
      }

      let layoutData;
      switch (type) {
        case "Banner":
          if (layout.banner?.image?.public_id) {
            await destroyImageFromCloudinary(layout.banner.image.public_id);
          }
          layoutData = await createBannerLayout(req);
          break;
        case "Categories":
          layoutData = createCategoriesLayout(req);
          break;
        case "FAQ":
          layoutData = createFAQLayout(req);
          break;
        default:
          return next(new ErrorHandler("Invalid layout type", 400));
      }

      const updatedLayout = await LayoutModel.findByIdAndUpdate(
        layout._id,
        layoutData,
        { new: true }
      );

      res.status(200).json({
        success: true,
        layout: updatedLayout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query;
      const layout = await LayoutModel.findOne({ type });
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
