import * as React from "react";

import { Contract, ethers } from "ethers";
import merkleDistributorAbi from "./merkle-distributor-abi.json";
import { useContractFunction, useEtherBalance, useEthers } from "@usedapp/core";
import { formatEther } from "ethers/lib/utils";

const merkleDistributorInterface = new ethers.utils.Interface(
  merkleDistributorAbi
);

const merkleDistributorAddress = "0xfedfaf1a10335448b7fa0268f56d2b44dbd357de";

const merkleDistributorContract = new Contract(
  merkleDistributorAddress,
  merkleDistributorInterface
);

export default function DApp() {
  const { activateBrowserWallet, deactivate, account } = useEthers();
  const userBalance = useEtherBalance(account);
  const { send: doClaim, state: claimState } = useContractFunction(
    merkleDistributorContract,
    "claim",
    {
      transactionName: "Claim",
    }
  );

  const { proof } = useProof(account);

  return (
    <div>
      {!account && <button onClick={activateBrowserWallet}> Connect </button>}
      {account && <button onClick={deactivate}> Disconnect </button>}
      {userBalance && (
        <p>
          Ether balance: {formatEther(userBalance)} ETH for account{" "}
          {account?.slice(0, 5) + "..." + account?.slice(-5)}
        </p>
      )}
      {account && (
        <div>
          <h2>Proof &amp; claim</h2>
          <pre>{JSON.stringify({ proof, claimState }, null, 2)}</pre>
          <button
            onClick={() =>
              doClaim(proof?.index, account, proof?.amount, proof?.proof)
            }
            disabled={proof === null}
          >
            Claim
          </button>
          {proof === null && (
            <p>
              There's no proof available for the connected wallet, so no point
              in sending the claim transaction.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type OpProof = {
  index: number;
  amount: string;
  proof: Array<string>;
};

function useProof(address: string | undefined) {
  const [proof, setProof] = React.useState<OpProof | null>(null);

  React.useEffect(() => {
    if (!address) {
      return;
    }

    // use dev proxy here to avoid CORS issues
    fetch(`/proof/${address}`)
      .then((response) => response.json())
      .then((proof) => setProof(proof))
      .catch((error) => console.error("useProof", { error }));
  }, [address]);

  return { proof };
}
