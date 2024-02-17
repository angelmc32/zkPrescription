export type StepperProps = {
  step: number;
  onPrevClick?: () => void;
  onNextClick?: () => void;
};

export default function Stepper({ step, onPrevClick, onNextClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="w-full">
        <hr className="my-5 h-0.5 border-t-0 bg-slate-300 w-full" />
      </div>
      <div className="flex justify-between mb-3">
        {onPrevClick !== undefined ? (
          <button className="" disabled={!onPrevClick} onClick={onPrevClick || undefined}>
            Prev
          </button>
        ) : (
          <span></span>
        )}
        <p>{step.toString()}/3</p>
        {onNextClick !== undefined ? (
          <button className="" disabled={!onNextClick} onClick={onNextClick || undefined}>
            Next
          </button>
        ) : (
          <span></span>
        )}
      </div>
    </div>
  );
}
