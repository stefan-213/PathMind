type NormalizeDrawioXmlResult =
  | {
      ok: true;
      xml: string;
      repaired: boolean;
    }
  | {
      ok: false;
      error: string;
      xmlPreview: string;
    };

const DRAWIO_ATTR_NAMES = new Set([
  'agent',
  'arrows',
  'as',
  'connect',
  'dx',
  'dy',
  'edge',
  'fold',
  'grid',
  'gridSize',
  'guides',
  'height',
  'host',
  'html',
  'id',
  'label',
  'math',
  'modified',
  'name',
  'page',
  'pageHeight',
  'pageScale',
  'pageWidth',
  'parent',
  'relative',
  'shadow',
  'source',
  'style',
  'target',
  'tooltips',
  'value',
  'vertex',
  'version',
  'width',
  'x',
  'y',
]);

const stripCodeFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:xml)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const isValidXmlChar = (char: string) => {
  const codePoint = char.codePointAt(0);

  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (typeof codePoint === 'number' &&
      ((codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)))
  );
};

const removeInvalidXmlChars = (value: string) => Array.from(value).filter(isValidXmlChar).join('');

const extractDrawioXml = (value: string) => {
  const cleaned = stripCodeFence(removeInvalidXmlChars(value));
  const mxfileStart = cleaned.indexOf('<mxfile');
  const mxfileEnd = cleaned.lastIndexOf('</mxfile>');

  if (mxfileStart >= 0 && mxfileEnd >= mxfileStart) {
    return cleaned.slice(mxfileStart, mxfileEnd + '</mxfile>'.length);
  }

  const graphStart = cleaned.indexOf('<mxGraphModel');
  const graphEnd = cleaned.lastIndexOf('</mxGraphModel>');

  if (graphStart >= 0 && graphEnd >= graphStart) {
    const graphModel = cleaned.slice(graphStart, graphEnd + '</mxGraphModel>'.length);
    return `<mxfile host="app.diagrams.net"><diagram name="Page-1">${graphModel}</diagram></mxfile>`;
  }

  return cleaned;
};

const escapeAttributeValue = (value: string) =>
  value
    .replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\w.-]*;)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getTagEnd = (xml: string, start: number) => {
  let quote: string | null = null;

  for (let index = start; index < xml.length; index += 1) {
    const char = xml[index];

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '>') {
      return index;
    }
  }

  return -1;
};

const findAttributePositions = (attributes: string) => {
  const positions: Array<{ name: string; start: number; valueStart: number }> = [];
  const attributePattern = /(^|\s)([a-z_][\w:.-]*)\s*=/gi;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributes)) !== null) {
    const name = match[2];

    if (!name || !DRAWIO_ATTR_NAMES.has(name)) {
      continue;
    }

    positions.push({
      name,
      start: match.index + match[1].length,
      valueStart: attributePattern.lastIndex,
    });
  }

  return positions;
};

const cleanRawAttributeValue = (value: string) => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  let cleaned = trimmed;

  if (quote === '"' || quote === "'") {
    cleaned = cleaned.slice(1);
    if (cleaned.endsWith(quote)) {
      cleaned = cleaned.slice(0, -1);
    }
  }

  return cleaned.trim();
};

const repairStartTag = (tagContent: string) => {
  const tagMatch = tagContent.match(/^([a-z_][\w:.-]*)([\s\S]*)$/i);

  if (!tagMatch) {
    return `<${tagContent}>`;
  }

  const [, tagName, attributeText] = tagMatch;
  const attributes = attributeText.trimEnd();
  const isSelfClosing = /\/\s*$/.test(attributes);
  const normalizedAttributes = isSelfClosing ? attributes.replace(/\/\s*$/, '') : attributes;
  const positions = findAttributePositions(normalizedAttributes);

  if (positions.length === 0) {
    return `<${tagName}${isSelfClosing ? ' /' : ''}>`;
  }

  const repairedAttributes = new Map<string, string>();

  positions.forEach((position, index) => {
    const nextStart = positions[index + 1]?.start ?? normalizedAttributes.length;
    const rawValue = normalizedAttributes.slice(position.valueStart, nextStart);
    repairedAttributes.set(position.name, escapeAttributeValue(cleanRawAttributeValue(rawValue)));
  });

  const repairedAttributeText = Array.from(repairedAttributes, ([name, value]) => `${name}="${value}"`).join(' ');

  return `<${tagName} ${repairedAttributeText}${isSelfClosing ? ' /' : ''}>`;
};

const repairTagAttributes = (xml: string) => {
  let repaired = '';
  let index = 0;

  while (index < xml.length) {
    const tagStart = xml.indexOf('<', index);

    if (tagStart < 0) {
      repaired += xml.slice(index);
      break;
    }

    repaired += xml.slice(index, tagStart);

    if (xml.startsWith('<!--', tagStart)) {
      const commentEnd = xml.indexOf('-->', tagStart + 4);
      if (commentEnd < 0) {
        break;
      }
      repaired += xml.slice(tagStart, commentEnd + 3);
      index = commentEnd + 3;
      continue;
    }

    if (
      xml.startsWith('</', tagStart) ||
      xml.startsWith('<![CDATA[', tagStart) ||
      xml.startsWith('<!', tagStart) ||
      xml.startsWith('<?', tagStart)
    ) {
      const simpleTagEnd = xml.indexOf('>', tagStart + 1);
      if (simpleTagEnd < 0) {
        break;
      }
      repaired += xml.slice(tagStart, simpleTagEnd + 1);
      index = simpleTagEnd + 1;
      continue;
    }

    const tagEnd = getTagEnd(xml, tagStart + 1);
    if (tagEnd < 0) {
      repaired += xml.slice(tagStart);
      break;
    }

    repaired += repairStartTag(xml.slice(tagStart + 1, tagEnd));
    index = tagEnd + 1;
  }

  return repaired;
};

const getXmlValidationError = (xml: string) => {
  if (typeof DOMParser === 'undefined') {
    return null;
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.querySelector('parsererror');

  if (parserError) {
    return parserError.textContent?.trim() || 'Invalid XML';
  }

  if (!document.querySelector('mxGraphModel')) {
    return 'Missing mxGraphModel';
  }

  return null;
};

export const normalizeDrawioXml = (value: string): NormalizeDrawioXmlResult => {
  const extractedXml = extractDrawioXml(value);
  const directError = getXmlValidationError(extractedXml);

  if (!directError) {
    return {
      ok: true,
      xml: extractedXml,
      repaired: false,
    };
  }

  const repairedXml = repairTagAttributes(extractedXml);
  const repairedError = getXmlValidationError(repairedXml);

  if (!repairedError) {
    return {
      ok: true,
      xml: repairedXml,
      repaired: true,
    };
  }

  return {
    ok: false,
    error: repairedError,
    xmlPreview: extractedXml.slice(0, 300),
  };
};
