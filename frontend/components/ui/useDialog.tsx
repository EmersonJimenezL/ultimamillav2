import { useCallback, useRef, useState } from "react";
import type { HTMLInputTypeAttribute } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type DialogVariant = "info" | "success" | "warning" | "danger";

type BaseOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
};

type AlertState = BaseOptions & {
  type: "alert";
  message: string;
};

type ConfirmState = BaseOptions & {
  type: "confirm";
  message: string;
};

type PromptState = BaseOptions & {
  type: "prompt";
  message: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  inputType?: HTMLInputTypeAttribute;
};

type DialogState = AlertState | ConfirmState | PromptState;

export type PromptOptions = Omit<PromptState, "type" | "message">;

function variantIcon(variant: DialogVariant) {
  switch (variant) {
    case "success":
      return { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "✓" };
    case "warning":
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "!" };
    case "danger":
      return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "✖" };
    case "info":
    default:
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "i" };
  }
}

export function useDialog() {
  const [state, setState] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);

  const resolverRef = useRef<((value: unknown) => void) | null>(null);

  const close = useCallback(() => {
    setState(null);
    setPromptValue("");
    setPromptError(null);
    resolverRef.current = null;
  }, []);

  const showAlert = useCallback((message: string, options: BaseOptions = {}) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setState({
        type: "alert",
        message,
        title: options.title ?? "Aviso",
        confirmText: options.confirmText ?? "OK",
        variant: options.variant ?? "info",
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, options: BaseOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (value) => resolve(value as boolean);
      setState({
        type: "confirm",
        message,
        title: options.title ?? "Confirmar",
        confirmText: options.confirmText ?? "Aceptar",
        cancelText: options.cancelText ?? "Cancelar",
        variant: options.variant ?? "warning",
      });
    });
  }, []);

  const showPrompt = useCallback((message: string, options: PromptOptions = {}) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (value) => resolve(value as string | null);
      setPromptValue(options.defaultValue ?? "");
      setPromptError(null);
      setState({
        type: "prompt",
        message,
        title: options.title ?? "Ingresar dato",
        confirmText: options.confirmText ?? "Continuar",
        cancelText: options.cancelText ?? "Cancelar",
        variant: options.variant ?? "info",
        label: options.label,
        placeholder: options.placeholder,
        defaultValue: options.defaultValue,
        required: options.required,
        inputType: options.inputType,
      });
    });
  }, []);

  const onConfirm = () => {
    const resolve = resolverRef.current;
    if (!state || !resolve) return;

    if (state.type === "alert") {
      resolve(undefined);
      close();
      return;
    }

    if (state.type === "confirm") {
      resolve(true);
      close();
      return;
    }

    const value = promptValue;
    const validator = (state as PromptState).required
      ? (v: string) => (v.trim() ? null : "Este campo es obligatorio.")
      : null;
    const error = validator ? validator(value) : null;

    if (error) {
      setPromptError(error);
      return;
    }

    resolve(value);
    close();
  };

  const onCancel = () => {
    const resolve = resolverRef.current;
    if (!state || !resolve) return;

    if (state.type === "alert") resolve(undefined);
    if (state.type === "confirm") resolve(false);
    if (state.type === "prompt") resolve(null);
    close();
  };

  const dialog = state ? (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={state.title || "Aviso"}
      size="sm"
      zIndex={60}
      footer={
        state.type === "alert" ? (
          <Button onClick={onConfirm} variant="primary" size="sm">
            {state.confirmText || "OK"}
          </Button>
        ) : (
          <>
            <Button onClick={onCancel} variant="secondary" size="sm">
              {state.cancelText || "Cancelar"}
            </Button>
            <Button
              onClick={onConfirm}
              variant={state.variant === "danger" ? "danger" : "primary"}
              size="sm"
            >
              {state.confirmText || "Aceptar"}
            </Button>
          </>
        )
      }
    >
      {(() => {
        const v = variantIcon(state.variant ?? "info");
        return (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${v.bg} ${v.border}`}>
              <div className="flex items-start gap-2">
                <span className={`font-bold ${v.text} w-5 text-center`}>{v.icon}</span>
                <p className="text-sm text-gray-900 leading-relaxed">{state.message}</p>
              </div>
            </div>

            {state.type === "prompt" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  {state.label ?? "Valor"}
                  {state.required ? <span className="text-red-600"> *</span> : null}
                </label>
                <input
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={state.placeholder || "Escribe aquí..."}
                  type={state.inputType ?? "text"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  autoFocus
                />
                {promptError && <p className="text-xs text-red-600">{promptError}</p>}
              </div>
            )}
          </div>
        );
      })()}
    </Modal>
  ) : null;

  return { dialog, showAlert, showConfirm, showPrompt };
}
