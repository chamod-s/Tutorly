declare module 'node-media-server' {
  type NmsEventCallback = (id: string, StreamPath: string, args: Record<string, unknown>) => void;

  interface NodeMediaServerConfig {
    rtmp?: {
      port?: number;
      chunk_size?: number;
      gop_cache?: boolean;
      ping?: number;
      ping_timeout?: number;
    };
    http?: {
      port?: number;
      mediaroot?: string;
      allow_origin?: string;
    };
    trans?: {
      ffmpeg?: string;
      tasks?: Array<Record<string, unknown>>;
    };
  }

  class NodeMediaServer {
    constructor(config: NodeMediaServerConfig);
    run(): void;
    stop(): void;
    on(event: 'prePublish' | 'postPublish' | 'donePublish' | 'prePlay' | 'donePlay', callback: NmsEventCallback): this;
    getSession(id: string): { reject: () => void } | undefined;
  }

  export = NodeMediaServer;
}
