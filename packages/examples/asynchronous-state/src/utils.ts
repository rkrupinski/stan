import { object, number, type InferType } from "yup";

const schema = object({
  value: number().required(),
});

type SchemaType = InferType<typeof schema>;

export const isValid = (candidate: unknown): candidate is SchemaType =>
  schema.isValidSync(candidate);
