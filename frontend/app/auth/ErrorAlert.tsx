interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
      {message}
    </div>
  );
}
