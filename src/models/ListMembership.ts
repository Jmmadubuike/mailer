import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IListMembership {
  _id: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const listMembershipSchema = new Schema<IListMembership>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "MailingList",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

listMembershipSchema.index({ contactId: 1, listId: 1 }, { unique: true });
listMembershipSchema.index({ listId: 1 });

export const ListMembership: Model<IListMembership> =
  (models.ListMembership as Model<IListMembership>) ??
  model<IListMembership>("ListMembership", listMembershipSchema);
