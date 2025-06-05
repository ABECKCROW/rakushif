declare module "csv-stringify/sync" {
  import { Row, Options } from "csv-stringify";
  export function stringify(records: Row[], options?: Options): string;
}