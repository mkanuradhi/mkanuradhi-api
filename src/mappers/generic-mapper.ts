import BaseDocument from "../documents/base-document";

const mapDocument = <T extends BaseDocument>(doc: T): Record<string, any> => {
  const obj = doc.toObject({
    versionKey: false, // Exclude `__v` from the output
    virtuals: true, // Include virtual fields
    transform: (_, ret) => {
      ret.id = ret.id || (ret._id ? ret._id.toString() : undefined);
      delete ret._id;
      return ret;
    }
  });

  obj.v = doc.__v;
  return obj;
};

const mapDocuments = <T extends BaseDocument>(docs: T[]): Record<string, any>[] => {
  return docs.map(mapDocument);
};

export { mapDocument, mapDocuments };