import "dotenv/config";
import {
    ver,
    buildDist,
    buildImage,
    checkDocker,
    checkTagExists,
    checkVersionFormat,
    getRepoNames,
    checkReleaseBranch,
    createDistTarGz,
    createReleasePR,
} from "./lib.mjs";
import { resolvePreviousVersionRevision } from "../generate-changelog.mjs";
import semver from "semver";

const repoNames = getRepoNames();
const version = process.env.RELEASE_BETA_VERSION;
const dryRun = process.env.DRY_RUN === "true";
const previousVersion = process.env.RELEASE_PREVIOUS_VERSION;
const branchName = `release-${version}`;
const githubRunId = process.env.GITHUB_RUN_ID;

if (dryRun) {
    console.log("Dry run mode enabled. No images will be pushed.");
}

console.log("RELEASE_BETA_VERSION:", version);

// Check if docker is running
checkDocker();

// Build frontend dist
buildDist();

if (!dryRun) {
    // Build slim image (rootless)
    buildImage(
        repoNames,
        ["beta-slim-rootless", ver(version, "slim-rootless")],
        "rootless",
        "BASE_IMAGE=starit/uptime-gizmo:base2-slim"
    );

    // Build full image (rootless)
    buildImage(repoNames, ["beta-rootless", ver(version, "rootless")], "rootless");

    // Build slim image
    buildImage(repoNames, ["beta-slim", ver(version, "slim")], "release", "BASE_IMAGE=starit/uptime-gizmo:base2-slim");

    // Build full image
    buildImage(repoNames, ["beta", version], "release");
} else {
    console.log("Dry run mode - skipping image build and push.");
}

// Create dist.tar.gz
await createDistTarGz();

// Auto-finish: generate changelog, squash merge PR (non-dry-run only), create draft release with dist.tar.gz
await import("./finish.mjs");
