import detectEthereumProvider from "@metamask/detect-provider";
import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import { loadContract } from "./utils/load-contract";
import "./App.css";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [shouldReload, reload] = useState(false);

  const canConnectToContract = account && web3Api.contract;

  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload]);

  const setAccountListener = (provider) => {
    // provider.on("accountsChanged", (accounts) => setAccount(accounts[0]));

    // provider._jsonRpcConnection.events.on("notification", (payload) => {
    //   const { method } = payload;
    //   if (method === "matamask_unlockStateChanged") setAccount(null);
    // });

    provider.on("accountsChanged", (_) => window.location.reload());
    provider.on("chainChanged", (_) => window.location.reload());
  };

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        setAccountListener(provider);
        const contract = await loadContract("Faucet", provider);
        const web3 = new Web3(provider);

        setWeb3Api({
          provider,
          web3,
          contract,
          isProviderLoaded: true,
        });
      } else {
        setWeb3Api((cur) => {
          return { ...cur, isProviderLoaded: true };
        });
        console.error("Please install MetaMask!");
      }
    };

    loadProvider();
  }, []);

  useEffect(() => {
    const getAccounts = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };

    web3Api.web3 && getAccounts();
  }, [web3Api.web3]);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const balance = await web3.eth.getBalance(contract.address);
      balance && setBalance(web3.utils.fromWei(balance, "ether"));
    };

    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api;

    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });

    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  const withdraw = useCallback(async () => {
    const { contract, web3 } = web3Api;
    const withdrawAmount = web3.utils.toWei("0.1", "ether");
    await contract.withdraw(withdrawAmount, {
      from: account,
    });

    reloadEffect();
  }, [account, reloadEffect, web3Api]);

  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
          {web3Api.isProviderLoaded ? (
            <div className="is-flex is-align-items-center">
              <span className="mr-2">
                <strong>Account: </strong>
              </span>
              {account ? (
                <div>{account}</div>
              ) : !web3Api.provider ? (
                <>
                  <div className="notification is-warning is-size-6 is-rounded">
                    Wallet is not detected!{" "}
                    <a
                      target="_blank"
                      href="https://docs.metamask.io"
                      rel="noreferrer"
                    >
                      Install MetaMask
                    </a>
                  </div>
                </>
              ) : (
                <button
                  className="button is-info is-light is-small"
                  onClick={() =>
                    web3Api.provider.request({ method: "eth_requestAccounts" })
                  }
                >
                  Connect Wallet
                </button>
              )}
            </div>
          ) : (
            <span>Looking for web3...</span>
          )}
          <div className="balance-view is-size-2 my-5">
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          {!canConnectToContract && (
            <i className="is-block is-warning">Connect to Ganache</i>
          )}
          <button
            disabled={!canConnectToContract}
            onClick={addFunds}
            className="button is-link mr-2"
          >
            Donate 1eth
          </button>
          <button
            disabled={!canConnectToContract}
            onClick={withdraw}
            className="button is-primary"
          >
            Withdraw 0.1eth
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
