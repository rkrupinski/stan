import type * as PrismNamespace from 'prismjs';

export default function prismIncludeLanguages(
  PrismObject: typeof PrismNamespace,
) {
  PrismObject.languages.vue = PrismObject.languages.markup;
}
