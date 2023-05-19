import { Battle } from "@shandi/lsb/lsb";
import zstd from "zstandard-wasm";

zstd.loadWASM();

export async function loadBattleFromResponse(res: Response): Promise<Battle> {
  console.time("load-battle");
  const data = await res.arrayBuffer();
  console.timeLog("load-battle", "request body finished");
  const raw = zstd.decompress(new Uint8Array(data));
  console.timeLog("load-battle", "finished zstd decompression");
  const result = Battle.decode(raw);
  console.timeEnd("load-battle");
  return result;
}
