import { readFileSync } from "fs";
import { compile } from "handlebars";
import { resolve } from "path";

export function getTemplate(templatePath: string) {
  const templateString = readFileSync(resolve(templatePath), 'utf8').toString();  
  return compile(templateString);
}