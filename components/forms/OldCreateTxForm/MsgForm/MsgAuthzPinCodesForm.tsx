import { useEffect, useState } from "react";
import { MsgGetter } from "..";
import { useChains } from "../../../../context/ChainsContext";
import { checkAddress, exampleAddress, trimStringsObj } from "../../../../lib/displayHelpers";
import {
  NYX_WASM_AUTHORITY,
  makeAuthzPinCodesMsg,
  parseCodeIdsInput,
} from "../../../../lib/wasmPinAuthz";
import Input from "../../../inputs/Input";
import StackableContainer from "../../../layout/StackableContainer";

interface MsgAuthzPinCodesFormProps {
  readonly senderAddress: string;
  readonly setMsgGetter: (msgGetter: MsgGetter) => void;
  readonly deleteMsg: () => void;
}

const MsgAuthzPinCodesForm = ({
  senderAddress,
  setMsgGetter,
  deleteMsg,
}: MsgAuthzPinCodesFormProps) => {
  const { chain } = useChains();

  const [authority, setAuthority] = useState(NYX_WASM_AUTHORITY);
  const [codeIds, setCodeIds] = useState("");

  const [authorityError, setAuthorityError] = useState("");
  const [codeIdsError, setCodeIdsError] = useState("");

  const trimmedInputs = trimStringsObj({ authority, codeIds });

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const { authority, codeIds } = trimmedInputs;

    const isMsgValid = (): boolean => {
      setAuthorityError("");
      setCodeIdsError("");

      const authorityErrorMsg = checkAddress(authority, chain.addressPrefix);
      if (authorityErrorMsg) {
        setAuthorityError(`Invalid address for network ${chain.chainId}: ${authorityErrorMsg}`);
        return false;
      }

      if (!parseCodeIdsInput(codeIds)) {
        setCodeIdsError("Code IDs must be positive integers (comma or space separated)");
        return false;
      }

      return true;
    };

    const parsedCodeIds = parseCodeIdsInput(codeIds) ?? [];
    const msg = makeAuthzPinCodesMsg(senderAddress, authority, parsedCodeIds);

    setMsgGetter({ isMsgValid, msg });
  }, [chain.addressPrefix, chain.chainId, senderAddress, setMsgGetter, trimmedInputs]);

  return (
    <StackableContainer lessPadding lessMargin>
      <button className="remove" onClick={() => deleteMsg()}>
        ✕
      </button>
      <h2>MsgPinCodes (authz)</h2>
      <div className="form-item">
        <Input
          label="Authority"
          name="authority"
          value={authority}
          onChange={({ target }) => {
            setAuthority(target.value);
            setAuthorityError("");
          }}
          error={authorityError}
          placeholder={`E.g. ${exampleAddress(0, chain.addressPrefix)}`}
        />
      </div>
      <div className="form-item">
        <Input
          label="Code IDs"
          name="code-ids"
          value={codeIds}
          onChange={({ target }) => {
            setCodeIds(target.value);
            setCodeIdsError("");
          }}
          error={codeIdsError}
          placeholder="E.g. 79"
        />
      </div>
      <style jsx>{`
        .form-item {
          margin-top: 1.5em;
        }

        .form-item label {
          font-style: italic;
          font-size: 12px;
        }

        button.remove {
          background: rgba(255, 255, 255, 0.2);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          color: white;
          position: absolute;
          right: 10px;
          top: 10px;
        }
      `}</style>
    </StackableContainer>
  );
};

export default MsgAuthzPinCodesForm;
