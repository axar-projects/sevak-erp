import mongoose, { Schema, model, models } from "mongoose";

export interface IFieldConfig {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    label: string;
    enabled: boolean;
    width?: number; // Optional width constraint
    height?: number; // Optional height constraint (mostly for image)
    rotation?: number; // Degrees
    fontWeight?: string; // 'bold', '900', etc.
}

export interface ITemplateConfig {
    _id?: string;
    imageArea: IFieldConfig;
    fields: {
        name: IFieldConfig;
        seva: IFieldConfig;
        mobile: IFieldConfig;
        gaam: IFieldConfig;
        startDate: IFieldConfig;
        endDate: IFieldConfig;
        qrCode: IFieldConfig; // NEW: QR Code configuration
        uniqueId: IFieldConfig;
    };
    updatedAt?: Date;
}

const FieldConfigSchema = new Schema<IFieldConfig>({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    fontSize: { type: Number, default: 24 },
    color: { type: String, default: "#000000" },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    width: { type: Number },
    height: { type: Number },
    rotation: { type: Number, default: 0 },
    fontWeight: { type: String, default: "normal" },
}, { _id: false });

const TemplateConfigSchema = new Schema<ITemplateConfig>(
    {
        imageArea: { type: FieldConfigSchema, required: true },
        fields: {
            name: { type: FieldConfigSchema, required: true },
            seva: { type: FieldConfigSchema, required: true },
            mobile: { type: FieldConfigSchema, required: true },
            gaam: { type: FieldConfigSchema, required: true },
            startDate: { type: FieldConfigSchema, required: true },
            endDate: { type: FieldConfigSchema, required: true },
            qrCode: { type: FieldConfigSchema, required: true },
            uniqueId: { type: FieldConfigSchema, required: true },
        },
    },
    { timestamps: true }
);

// Prevent Mongoose from creating multiple models in development
if (process.env.NODE_ENV === "development" && mongoose.models.TemplateConfig) {
    delete mongoose.models.TemplateConfig;
}

const TemplateConfig = models.TemplateConfig || model<ITemplateConfig>("TemplateConfig", TemplateConfigSchema);

export default TemplateConfig;
