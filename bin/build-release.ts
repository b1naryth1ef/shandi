type GithubReleaseAsset = {
  name: string;
  label: string;
  state: string;
  content_type: string;
  size: number;
  download_count: number;
  url: string;
  browser_download_url: string;
};

type GithubRelease = {
  draft: boolean;
  prerelease: boolean;
  id: number;
  tag_name: string;
  name: string;
  body: string;
  assets: Array<GithubReleaseAsset>;
};

async function run(cmd: Array<string>) {
  const status = await Deno.run({ cmd }).status();
  if (!status.success) {
    throw new Error(`Failed to run command: ${cmd}`);
  }
}

async function generateBinDiff(tag: string) {
  const res = await fetch(
    `https://api.github.com/repos/b1naryth1ef/shandi/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to read releases from GitHub: ${await res.text()}`);
  }

  let releases = (await res.json()) as Array<GithubRelease>;
  releases = releases.filter((it) => !it.prerelease && !it.draft);

  if (releases.length === 0) {
    console.log("[WARNING] no previous releases found, skipping bindiff");
    return;
  }

  const release = releases[0];
  let file;

  for (const asset of release.assets) {
    if (asset.name === "shandi.exe") {
      file = asset;
      break;
    }
  }

  if (!file) throw new Error("no valid shandi.exe found for previous release");

  console.log(
    `Downloading previous release (${release.name}) binary for bindiff generation`
  );
  const oldFilePath = await Deno.makeTempFile();

  const oldFileRes = await fetch(file.url, {
    headers: {
      Accept: "application/octet-stream",
    },
  });
  if (!oldFileRes.ok) {
    throw new Error(`failed to download old file: ${res.status}`);
  }

  const oldFile = await Deno.open(oldFilePath, { write: true });
  await oldFileRes.body.pipeTo(oldFile.writable);

  console.log(`Generating bindiff patch between ${release.name} and ${tag}`);
  await run([
    "go",
    "run",
    "bin/generate-bindiff.go",
    oldFilePath,
    "shandi.exe",
    `${release.name}-shandi.exe.patch`,
  ]);
}

async function build(tag: string) {
  // setup
  await run(["just", "setup"]);

  // generate win-res
  await run(["just", "generate-app-winres"]);

  // build-app-frontend
  await run(["just", "build-app-frontend"]);

  // run actual build
  await run([
    "go",
    "build",
    "-o",
    "shandi.exe",
    "-ldflags",
    `-X github.com/b1naryth1ef/shandi/app.version=${tag} -s -w -H=windowsgui -extldflags=-static`,
    "app/cmd/shandi/main.go",
  ]);
}

async function main() {
  if (Deno.args.length === 0) {
    throw new Error(`Missing required Git tag for release`);
  }

  const tagParts = Deno.args[0].split("/");
  if (tagParts.length !== 3) {
    throw new Error(`Expected tag to be 3 parts: ${tagParts}`);
  }

  const tag = tagParts[2];

  // generate release build
  await build(tag);

  // generate bindiff
  await generateBinDiff(tag);
}

await main();
