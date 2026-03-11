import { useQuery } from "@tanstack/react-query";
import { Button, Card, Container, Form, Row } from "react-bootstrap";
import { formatBytes } from "../utils/format";
import {
  ChevronLeft,
  CirclePlay,
  ClipboardCopy,
  Download,
  SquarePlay,
  TrafficCone,
  Tv,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingContainer } from "./Loader";
import { StreamButton } from "./Buttons";
import { createIntentUrl, getStreamingLink } from "../utils/link";
import toast from "react-hot-toast";
import { getMetadata } from "../apis/firebase";

export default function FileMetadata(props) {
  const navigate = useNavigate();
  const params = useParams();

  const file_id = props.file_id || params.file_id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["file", file_id],
    enabled: !!file_id,
    queryFn: () => getMetadata(file_id),
  });

  if (!file_id) return <div>Invalid Route</div>;

  if (isLoading) return <LoadingContainer />;

  if (isError) return <div>Error: {error.message}</div>;

  const streamingLink = getStreamingLink(data);
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <Container className="my-4">
      <Card className="border-0 shadow-lg">
        <Button
          className="p-0 border-0"
          onClick={() =>
            navigate(`/content/${data.media_type}/${data.tmdb_id}`)
          }
        >
          <Card.Header className="bg-dark-subtle border-0">
            <div className="d-flex align-items-center text-primary gap">
              <ChevronLeft className="" strokeWidth={2} />
              <div className="">
                <strong>{data.episode_code}</strong>
              </div>
            </div>
          </Card.Header>
        </Button>
        <Card.Body>
          <Row className="gap-2" style={{ fontSize: "0.9rem" }}>
            <div className="text-break">
              <strong>{data.file_name}</strong>
            </div>
            <div>
              <strong>File Size: </strong>
              {formatBytes(data.file_size)}
            </div>
            <div>
              <strong>Uploaded At: </strong>
              {data.updated_at.toDate().toLocaleString()}
            </div>
            <div className="">
              <strong>Use Proxy: </strong>
              <Form.Switch
                className="d-inline ms-2"
                defaultChecked={localStorage.getItem("useproxy") == "true"}
                onChange={() => {
                  localStorage.setItem(
                    "useproxy",
                    localStorage.getItem("useproxy") == "true"
                      ? "false"
                      : "true",
                  );
                  window.location.reload();
                }}
              ></Form.Switch>
            </div>

            <div>
              <hr />
              <Row className="gap-2" style={{ fontSize: "1rem" }}>
                <div className="text-center">Stream</div>

                {/* Android */}
                <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
                  {/* {isAndroid && (
                    <StreamButton
                      icon={<SquarePlay />}
                      text={"MX Player"}
                      backgroundColor={"#3C8CF0"}
                      url={createIntentUrl(
                        streamingLink,
                        "com.mxtech.videoplayer.ad",
                      )}
                    />
                  )} */}
                  {isAndroid && (
                    <StreamButton
                      icon={<TrafficCone />}
                      text={"VLC Player"}
                      backgroundColor={"#FB940C"}
                      url={createIntentUrl(streamingLink, "org.videolan.vlc")}
                    />
                  )}
                  {isAndroid && (
                    <StreamButton
                      icon={<CirclePlay />}
                      text={"SVP Player"}
                      backgroundColor={"#F97870"}
                      url={createIntentUrl(streamingLink, "com.svpteam.svp")}
                    />
                  )}
                  {isAndroid && (
                    <StreamButton
                      icon={<Tv />}
                      text={"Play Online"}
                      backgroundColor={"#0CAC72"}
                      url={createIntentUrl(streamingLink)}
                    />
                  )}
                  <StreamButton
                    icon={<ClipboardCopy />}
                    text={"Copy Link"}
                    backgroundColor={"var(--bs-dark-bg-subtle)"}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(streamingLink);
                        toast("Link Copied");
                      } catch (e) {
                        toast("Copy Failed");
                      }
                    }}
                  />
                </div>
              </Row>
              <hr />
              <Row className="gap-2" style={{ fontSize: "1rem" }}>
                <div className="text-center">Download</div>

                {/* Android */}
                <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
                  <StreamButton
                    icon={<Download />}
                    text={"Download"}
                    backgroundColor={"var(--bs-dark-bg-subtle)"}
                    url={streamingLink}
                  />
                </div>
              </Row>
            </div>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
