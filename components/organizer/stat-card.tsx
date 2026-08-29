import { Card } from "@/components/ui/card";

type StatCardProps = {
    label: string;
    value: string | number;
    description?: string;
};

export function StatCard({
    label,
    value,
    description,
}: StatCardProps) {
    return (
        <Card className="p-5">
            <p className="text-sm text-zinc-500">{label}</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                {value}
            </p>

            {description ? (
                <p className="mt-1 text-xs text-zinc-500">
                    {description}
                </p>
            ) : null}
        </Card>
    );
}