import React, { useEffect, useState } from "react";

interface QuestionAndAnswerProps {}

export const QuestionAndAnswer: React.FC<QuestionAndAnswerProps> = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");

  const handleChange = (event: any) => {
    setInputValue(event.target.value);
  };

  useEffect(() => {
    if (inputValue == "4") {
      console.log("===TRIGGER BONUS");
    }
  }, [inputValue]);

  return (
    <>
      <div
        className="bg-white text-black fixed p-2 top-0 right-0 cursor-pointer"
        style={{ zIndex: "1002" }}
      >
        <p onClick={() => setOpen(!open)}>Question and Answer</p>

        {open && (
          <div>
            <p>What is 2 + 2?</p>
            <input type="text" value={inputValue} onChange={handleChange} />
          </div>
        )}
      </div>
    </>
  );
};
