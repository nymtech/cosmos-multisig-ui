import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  active: boolean;
}

export default function GeneralNews({ active }: Props) {
  return active ? (
    <Alert className="mx-auto my-4 max-w-md border-yellow-300 bg-fuchsia-900">
      <AlertTitle>Warning!</AlertTitle>
      <AlertDescription className="mt-3">
        Due to the database shutdown of our database provider, all data of multisig.confio.run will be deleted
        on September&nbsp;15<sup>th</sup>,&nbsp;2025.
      </AlertDescription>
      <AlertDescription className="mt-3">
        Please finish your signing processes before that date. Make sure you
        have all your public keys ready to re-create the multisig address from public keys + threshold values later on.
      </AlertDescription>
      <AlertDescription className="mt-3">
        At this point we don't know if and when Confio will bring back a hosted version of this tool. 
      </AlertDescription>
    </Alert>
  ) : null;
}
