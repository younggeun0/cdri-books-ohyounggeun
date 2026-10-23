// count가 null이면 결과 수를 아직 모르는 상태다. 내용은 비우고 줄 높이(min-h-6)만 차지해서, 결과가 와도 아래 목록이 밀리지 않게 한다.
// 로딩 중에도 같은 요소를 그려 두어야 결과가 오면 aria-live 영역의 내용이 바뀐 것으로 읽힌다.
// 새로 삽입된 live 영역은 스크린리더가 읽지 않을 수 있다.
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
