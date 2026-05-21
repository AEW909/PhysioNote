"use client";

import { useActionState } from "react";
import { updateFocusBoardAction, type UpdateFocusBoardState } from "@/app/focus/actions";
import { FOCUS_BOARD_SLUG, FOCUS_REWARD_TIERS } from "@/lib/focus-board/config";
import type { FocusBoardData } from "@/lib/focus-board/queries";

const initialState: UpdateFocusBoardState = {};

type FocusBoardProps = {
  board: FocusBoardData;
};

function formatWeekLabel(weekKey: string) {
  const date = new Date(`${weekKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function FocusBoard({ board }: FocusBoardProps) {
  const [state, formAction, pending] = useActionState(updateFocusBoardAction, initialState);

  return (
    <div className="focus-board-shell">
      <section className="focus-hero-card">
        <div>
          <p className="eyebrow">Liona weekly spark board</p>
          <h1>Small actions. Visible momentum. Better rewards.</h1>
          <p className="lede">
            Tap things as they get done, chase the monthly reward, and keep the business-building jobs
            feeling lighter instead of heavier.
          </p>
        </div>
        <div className="focus-reward-panel">
          <span className="focus-points-badge">{board.monthPoints} pts</span>
          <h2>{board.currentReward ? board.currentReward.label : "Get the month started"}</h2>
          <p>{board.currentReward?.description ?? "First points unlock the first reward tier."}</p>
          {board.nextReward ? (
            <p className="focus-next-reward">
              {board.nextReward.minPoints - board.monthPoints} points to unlock <strong>{board.nextReward.label}</strong>.
            </p>
          ) : (
            <p className="focus-next-reward">
              Top tier unlocked. Time for a proper monthly win.
            </p>
          )}
        </div>
      </section>

      <section className="focus-reward-track">
        {FOCUS_REWARD_TIERS.map((tier) => (
          <article
            className={`focus-tier-card ${board.monthPoints >= tier.minPoints ? "focus-tier-card-active" : ""}`}
            key={tier.label}
          >
            <p className="focus-tier-points">{tier.minPoints}+ pts</p>
            <h3>{tier.label}</h3>
            <p>{tier.description}</p>
          </article>
        ))}
      </section>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <section className="focus-week-grid">
        {board.weeks.map((week) => (
          <article className={`focus-week-card ${week.isCurrent ? "focus-week-card-current" : ""}`} key={week.weekKey}>
            <div className="focus-week-header">
              <div>
                <p className="focus-week-label">{week.isCurrent ? "This week" : "Week of"}</p>
                <h2>{formatWeekLabel(week.weekKey)}</h2>
              </div>
              <span className="focus-week-points">{week.weekPoints} pts</span>
            </div>

            <div className="focus-task-list">
              {week.tasks.map((task) => (
                <section className={`focus-task-card ${task.accentClass}`} key={task.key}>
                  <div className="focus-task-heading">
                    <div>
                      <h3>{task.title}</h3>
                    </div>
                    <details className="focus-help">
                      <summary aria-label={`About ${task.title}`}>?</summary>
                      <div className="focus-help-popover">{task.description}</div>
                    </details>
                  </div>
                  <div className="focus-metric-list">
                    {task.metrics.map((metric) => {
                      const metTarget = metric.target > 0 ? metric.count >= metric.target : metric.count > 0;

                      return (
                        <div className="focus-metric-row" key={metric.key}>
                          <div>
                            <p className="focus-metric-label">{metric.label}</p>
                            <p className="focus-metric-meta">
                              {metric.points} pts each
                              {metric.target > 0 ? ` · target ${metric.target}` : " · bonus"}
                            </p>
                          </div>
                          <div className="focus-metric-controls">
                            <form action={formAction}>
                              <input name="slug" type="hidden" value={FOCUS_BOARD_SLUG} />
                              <input name="weekKey" type="hidden" value={week.weekKey} />
                              <input name="monthKey" type="hidden" value={board.monthKey} />
                              <input name="taskKey" type="hidden" value={task.key} />
                              <input name="metricKey" type="hidden" value={metric.key} />
                              <input name="direction" type="hidden" value="remove" />
                              <button className="focus-icon-button" disabled={pending || metric.count === 0} type="submit">
                                -
                              </button>
                            </form>
                            <span className={`focus-metric-count ${metTarget ? "focus-metric-count-hit" : ""}`}>
                              {metric.kind === "toggle" ? (metric.count > 0 ? "Done" : "Tap me") : metric.count}
                            </span>
                            <form action={formAction}>
                              <input name="slug" type="hidden" value={FOCUS_BOARD_SLUG} />
                              <input name="weekKey" type="hidden" value={week.weekKey} />
                              <input name="monthKey" type="hidden" value={board.monthKey} />
                              <input name="taskKey" type="hidden" value={task.key} />
                              <input name="metricKey" type="hidden" value={metric.key} />
                              <input name="direction" type="hidden" value="add" />
                              <button className="focus-icon-button focus-icon-button-plus" disabled={pending} type="submit">
                                +
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
