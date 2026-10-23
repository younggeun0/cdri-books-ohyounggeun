/**
 * 검색 결과와 찜 목록 위에 "label 총 N건"을 보여 주는 aria-live 줄이다. 결과 수가 바뀌면 스크린리더가 읽어 준다.
 * count가 null이면 결과 수를 아직 모르는 상태다. 내용은 비우고 줄 높이(min-h-6)만 차지해서, 결과가 와도 아래 목록이 밀리지 않게 한다.
 * 새로 삽입된 live 영역은 스크린리더가 읽지 않을 수 있다. 로딩 중에도 count를 null로 그려 두면, 결과가 왔을 때 같은 요소의 내용이 바뀐 것으로 읽힌다.
 */
export function ResultCount({
  label,
  count,
}: {
  label: string;
  count: number | null;
}) {
  return (
    <p aria-live="polite" className="text-caption mt-6 flex min-h-6 gap-4">
      {count !== null && (
        <>
          <span>{label}</span>
          <span>
            총 <span className="text-primary">{count}</span>건
          </span>
        </>
      )}
    </p>
  );
}
