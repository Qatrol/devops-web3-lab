import { http, createConfig } from "wagmi";
import { mainnet, sepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { burnerWalletConnector } from "@my-crypto-app/burner-connector";

export const chains = [mainnet, sepolia, foundry] as const;

const connectors = [injected()];

// Add burner wallet only in development
if (process.env.NODE_ENV === "development") {
  connectors.push(
    // @ts-expect-error - wagmi connector type incompatibility with React 19
    burnerWalletConnector({
      storageKey: "bun-eth-burner-wallet",
      allowedChainIds: [31337],
    })
  );
}

export const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [foundry.id]: http("http://192.168.1.103:3007"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
