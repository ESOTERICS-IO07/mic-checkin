"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type ScanResult =
    | "success"
    | "already_checked_in"
    | "unknown_token"
    | "unauthorized"
    | "invalid_qr"
    | "error";

type QRPayload = {
    v: 1;
    eventId: string;
    token: string;
};

type QRScannerProps = {
    eventId: string;
};

export function QRScanner({ eventId }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const processingRef = useRef(false);

    const [result, setResult] = useState<ScanResult | null>(null);
    const [message, setMessage] = useState("");
    const [running, setRunning] = useState(false);

    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;

            if (scanner) {
                scanner
                    .stop()
                    .catch(() => { })
                    .finally(() => {
                        scanner.clear();
                    });
            }
        };
    }, []);

    async function hashToken(token: string) {
        const encoded = new TextEncoder().encode(token);
        const digest = await crypto.subtle.digest("SHA-256", encoded);

        return new Uint8Array(digest);
    }

    function bytesToHex(bytes: Uint8Array) {
        return Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    async function handleScan(decodedText: string) {
        if (processingRef.current) {
            return;
        }

        processingRef.current = true;

        try {
            let payload: QRPayload;

            try {
                payload = JSON.parse(decodedText);
            } catch {
                setResult("invalid_qr");
                setMessage("Invalid QR code.");
                processingRef.current = false;
                return;
            }

            if (
                payload?.v !== 1 ||
                typeof payload.eventId !== "string" ||
                typeof payload.token !== "string"
            ) {
                setResult("invalid_qr");
                setMessage("Invalid ticket format.");
                processingRef.current = false;
                return;
            }

            if (payload.eventId !== eventId) {
                setResult("invalid_qr");
                setMessage("This ticket belongs to a different event.");
                processingRef.current = false;
                return;
            }

            const tokenHash = await hashToken(payload.token);
            const tokenHashHex = bytesToHex(tokenHash);

            const response = await fetch("/api/check-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventId,
                    tokenHash: tokenHashHex,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setResult("error");
                setMessage(data.error ?? "Check-in failed.");
                processingRef.current = false;
                return;
            }

            const status = data.status as ScanResult;

            setResult(status);

            const messages: Record<ScanResult, string> = {
                success: "Check-in successful.",
                already_checked_in: "This ticket has already been checked in.",
                unknown_token: "Invalid or unknown ticket.",
                unauthorized: "You are not authorized to check in attendees.",
                invalid_qr: "Invalid QR code.",
                error: "Check-in failed.",
            };

            setMessage(messages[status] ?? "Check-in failed.");

            // Give the organizer time to see the result
            setTimeout(() => {
                processingRef.current = false;
            }, 1500);
        } catch (error) {
            console.error(error);
            setResult("error");
            setMessage("Something went wrong while processing the ticket.");
            processingRef.current = false;
        }
    }

    async function startScanner() {
        if (scannerRef.current) {
            return;
        }

        setResult(null);
        setMessage("");

        const scanner = new Html5Qrcode("qr-reader");

        scannerRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250,
                    },
                },
                async (decodedText) => {
                    await handleScan(decodedText);
                },
                () => {
                    // Ignore normal "QR not found yet" scan errors.
                },
            );

            setRunning(true);
        } catch (error) {
            console.error(error);
            setMessage(
                "Unable to access the camera. Check browser camera permissions.",
            );
            setResult("error");

            scannerRef.current = null;
        }
    }

    async function stopScanner() {
        const scanner = scannerRef.current;

        if (!scanner) {
            return;
        }

        try {
            await scanner.stop();
            scanner.clear();
        } catch {
            // Scanner may already be stopped.
        }

        scannerRef.current = null;
        setRunning(false);
    }

    return (
        <div className="space-y-4">
            <div
                id="qr-reader"
                className="mx-auto w-full max-w-md overflow-hidden rounded-lg border"
            />

            {!running ? (
                <button
                    type="button"
                    onClick={startScanner}
                    className="w-full rounded-md bg-zinc-900 px-4 py-3 font-medium text-white"
                >
                    Start Scanner
                </button>
            ) : (
                <button
                    type="button"
                    onClick={stopScanner}
                    className="w-full rounded-md border px-4 py-3 font-medium"
                >
                    Stop Scanner
                </button>
            )}

            {message ? (
                <div
                    className={`rounded-md border p-4 text-center ${result === "success"
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-red-300 bg-red-50 text-red-800"
                        }`}
                >
                    <p className="font-semibold">{message}</p>
                </div>
            ) : null}
        </div>
    );
}