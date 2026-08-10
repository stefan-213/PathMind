import { useAuthStore } from '../stores/authStore';

export type SseEventHandler<TEvent> = (event: TEvent, eventName: string) => void;

export interface PostSseOptions<TEvent> {
  signal?: AbortSignal;
  onEvent?: SseEventHandler<TEvent>;
}

type ParsedSseBlock = {
  event: string;
  data: string;
};

const parseSseBlock = (block: string): ParsedSseBlock | null => {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    const rawValue = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

    if (field === 'event') {
      event = value || 'message';
    } else if (field === 'data') {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0) return null;

  return {
    event,
    data: dataLines.join('\n'),
  };
};

const normalizeSseBuffer = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const dispatchSseBlock = <TEvent>(block: string, onEvent?: SseEventHandler<TEvent>) => {
  const parsed = parseSseBlock(block.trim());
  if (!parsed) return;

  const payload = JSON.parse(parsed.data) as TEvent;
  onEvent?.(payload, parsed.event);
};

export const postSse = async <TEvent = unknown>(
  url: string,
  data: unknown,
  { signal, onEvent }: PostSseOptions<TEvent> = {},
): Promise<void> => {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  };

  const token = useAuthStore.getState().token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Streaming response body is unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer = normalizeSseBuffer(buffer + decoder.decode(value, { stream: true }));

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      dispatchSseBlock(block, onEvent);
      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  buffer = normalizeSseBuffer(buffer + decoder.decode());
  if (buffer.trim()) {
    dispatchSseBlock(buffer, onEvent);
  }
};
