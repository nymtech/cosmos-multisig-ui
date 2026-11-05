import { MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { MsgPinCodes, MsgUnpinCodes } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import {
  MsgPinCodesTypeUrl,
  MsgUnpinCodesTypeUrl,
} from "../../../lib/wasmPinAuthz";
import HashView from "../HashView";

interface TxMsgExecDetailsProps {
  readonly msgValue: MsgExec;
}

const describeInner = (typeUrl: string, value: Uint8Array): string => {
  try {
    if (typeUrl === MsgPinCodesTypeUrl) {
      const msg = MsgPinCodes.decode(value);
      return `MsgPinCodes authority=${msg.authority} code_ids=[${msg.codeIds.join(", ")}]`;
    }
    if (typeUrl === MsgUnpinCodesTypeUrl) {
      const msg = MsgUnpinCodes.decode(value);
      return `MsgUnpinCodes authority=${msg.authority} code_ids=[${msg.codeIds.join(", ")}]`;
    }
  } catch {
    return `${typeUrl} (failed to decode)`;
  }
  return typeUrl;
};

const TxMsgExecDetails = ({ msgValue }: TxMsgExecDetailsProps) => (
  <>
    <li>
      <h3>MsgExec (authz)</h3>
    </li>
    <li>
      <label>Grantee:</label>
      <div title={msgValue.grantee}>
        <HashView hash={msgValue.grantee} />
      </div>
    </li>
    {msgValue.msgs.map((inner, index) => (
      <li key={`${inner.typeUrl}_${index}`}>
        <label>Inner msg {index + 1}:</label>
        <div>{describeInner(inner.typeUrl, inner.value)}</div>
      </li>
    ))}
    <style jsx>{`
      li:not(:has(h3)) {
        background: rgba(255, 255, 255, 0.03);
        padding: 6px 10px;
        border-radius: 8px;
        display: flex;
        align-items: center;
      }
      li + li:nth-child(2) {
        margin-top: 25px;
      }
      li + li {
        margin-top: 10px;
      }
      li div {
        padding: 3px 6px;
        word-break: break-all;
      }
      label {
        font-size: 12px;
        background: rgba(255, 255, 255, 0.1);
        padding: 3px 6px;
        border-radius: 5px;
        display: block;
        flex-shrink: 0;
      }
    `}</style>
  </>
);

export default TxMsgExecDetails;
