#!/usr/bin/env node
// scripts/update-env-host.js
// Wraps `pnpm dev` and auto-updates web/.env HOST vars when Shopify CLI tunnel URL is detected.

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

class EnvHostUpdater {
  constructor() {
    this.envPath = path.join(process.cwd(), "web", ".env");
    this.rootEnvPath = path.join(process.cwd(), ".env");
    this.currentHost = null;
  }

  cleanUrl(url) {
    if (!url) return null;
    url = url.replace(/\x1b\[[0-9;]*m/g, "");
    url = url.replace(/[│┤┐└┘┌┬├─┼┴┘┌┐│]/g, "");
    url = url.replace(/\/api\/proxy.*$/, "");
    url = url.replace(/\/+$/, "").split("?")[0].split("#")[0];
    return url.trim();
  }

  extractTunnelUrl(output) {
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, "");
    const patterns = [
      /Using URL: (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /App URL: (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /Preview URL: (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /Tunnel URL: (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /app_proxy.*?Using URL: (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /Forwarding.*?(https:\/\/[^.\s│┤┐└┘┌┬├─┼┴]*\.trycloudflare\.com)/,
      /Your tunnel is available at (https:\/\/[^\s│┤┐└┘┌┬├─┼┴]+)/,
      /(https:\/\/[a-z-]+\.trycloudflare\.com)(?!\/api)/,
    ];

    for (const pattern of patterns) {
      const match = cleanOutput.match(pattern);
      if (match && match[1] && !match[1].includes("myshopify.com")) {
        const cleanedUrl = this.cleanUrl(match[1]);
        if (cleanedUrl && cleanedUrl.startsWith("https://")) {
          return cleanedUrl;
        }
      }
    }
    return null;
  }

  parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return { lines: [], vars: {} };

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const vars = {};

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts
            .join("=")
            .trim()
            .replace(/^["']|["']$/g, "");
        }
      }
    });

    return { lines, vars };
  }

  updateEnvFile(filePath, newHost) {
    const { lines } = this.parseEnvFile(filePath);
    const cleanHost = this.cleanUrl(newHost);

    const urlVars = {
      HOST: cleanHost,
      SHOPIFY_APP_URL: cleanHost,
      SHOPIFY_TUNNEL_URL: cleanHost,
      APP_URL: cleanHost,
      NEXT_PUBLIC_SHOPIFY_APP_URL: cleanHost,
    };

    const updatedLines = [];
    const addedVars = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      let updated = false;

      for (const [varName, varValue] of Object.entries(urlVars)) {
        if (trimmed.startsWith(`${varName}=`)) {
          updatedLines.push(`${varName}=${varValue}`);
          addedVars.add(varName);
          updated = true;
          break;
        }
      }

      if (!updated) updatedLines.push(line);
    }

    let needsSection = false;
    for (const [varName, varValue] of Object.entries(urlVars)) {
      if (!addedVars.has(varName)) {
        if (!needsSection) {
          updatedLines.push("");
          updatedLines.push("# Auto-generated URLs (updated by dev script)");
          needsSection = true;
        }
        updatedLines.push(`${varName}=${varValue}`);
      }
    }

    fs.writeFileSync(filePath, updatedLines.join("\n"));
  }

  updateEnvFiles(newHost) {
    const cleanHost = this.cleanUrl(newHost);
    if (!cleanHost || this.currentHost === cleanHost) return;

    try {
      if (fs.existsSync(this.envPath)) {
        this.updateEnvFile(this.envPath, cleanHost);
        console.log(`Updated ${this.envPath}`);
      }

      if (fs.existsSync(this.rootEnvPath)) {
        this.updateEnvFile(this.rootEnvPath, cleanHost);
        console.log(`Updated ${this.rootEnvPath}`);
      }

      this.currentHost = cleanHost;
      console.log(`\nEnvironment updated with HOST: ${cleanHost}\n`);
    } catch (error) {
      console.error(`Failed to update .env files:`, error.message);
    }
  }

  startDev() {
    console.log("Starting pnpm dev with auto HOST update...\n");

    const devProcess = spawn("pnpm", ["dev"], {
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let foundInitialUrl = false;

    const processOutput = (data) => {
      const output = data.toString();
      process.stdout.write(output);

      const tunnelUrl = this.extractTunnelUrl(output);
      if (tunnelUrl && tunnelUrl !== this.currentHost) {
        this.updateEnvFiles(tunnelUrl);

        if (!foundInitialUrl) {
          foundInitialUrl = true;
          console.log(
            "Environment files updated. The new HOST URL is now available.\n"
          );
        }
      }
    };

    devProcess.stdout.on("data", processOutput);
    devProcess.stderr.on("data", processOutput);

    devProcess.on("close", (code) => {
      console.log(`\npnpm dev exited with code ${code}`);
    });

    process.on("SIGINT", () => {
      console.log("\nShutting down...");
      devProcess.kill("SIGINT");
      process.exit(0);
    });

    return devProcess;
  }
}

const updater = new EnvHostUpdater();
updater.startDev();

export default EnvHostUpdater;
