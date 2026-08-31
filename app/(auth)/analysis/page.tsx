import { auth } from "@clerk/nextjs/server";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvasV2";
import { generateAnalysisRoom } from "@/services/analysis";
import { getValuePropData } from "@/services/questions";
import { ValuePropProvider } from "../questions/_components/ValuePropProvider";

export default async function AnalysysPage() {
  const { orgId } = await auth();

  const valuePropData = await getValuePropData();
  await generateAnalysisRoom(`analysis-${orgId}`);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <ValuePropProvider valuePropData={valuePropData}>
          <Room roomId={`analysis-${orgId}`}>
            <InfiniteCanvas
              toolbarOptions={{
                text: false,
                table: false,
                answer: false,
                ellipse: false,
                feature: false,
                question: true,
                rectangle: false,
                interview: false,
                card: false,
              }}
            />
          </Room>
        </ValuePropProvider>
      </div>
    </div>
  );
}
