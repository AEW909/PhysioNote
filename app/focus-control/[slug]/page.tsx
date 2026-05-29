import { notFound } from "next/navigation";
import {
  addFocusBoardTaskAction,
  updateFocusBoardSettingsAction,
  updateFocusRewardTierAction,
} from "@/app/focus-control/actions";
import { FocusControlExistingGoals } from "@/components/focus/focus-control-existing-goals";
import { getFocusBoardRuntimeConfigByAdminSlug } from "@/lib/focus-board/runtime";

type FocusControlPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FocusControlPage({ params }: FocusControlPageProps) {
  const { slug } = await params;
  const runtime = await getFocusBoardRuntimeConfigByAdminSlug(slug);

  if (!runtime) {
    notFound();
  }

  return (
    <main className="shell focus-public-page focus-public-page-neon focus-board-shell-neon focus-control-page">
      <section className="focus-arcade-hero focus-control-hero">
        <p className="focus-kicker">Secret focus control room</p>
        <h1>Tune the game board</h1>
        <p className="focus-hero-copy">
          Change the weekly target, add new goals, adjust point weights, and reshape the reward ladder without touching code again.
        </p>
        <div className="focus-control-links">
          <div className="focus-control-link-card">
            <strong>Public board</strong>
            <p>/focus/{runtime.settings.boardSlug}</p>
          </div>
          <div className="focus-control-link-card">
            <strong>Control page</strong>
            <p>/focus-control/{runtime.settings.adminSlug}</p>
          </div>
        </div>
      </section>

      <section className="focus-control-grid">
        <article className="focus-control-card">
          <div className="split-header">
            <div>
              <p className="eyebrow">Board settings</p>
              <h2>Weekly target + headline</h2>
            </div>
          </div>

          <form action={updateFocusBoardSettingsAction} className="focus-control-form">
            <input name="adminSlug" type="hidden" value={runtime.settings.adminSlug} />
            <label className="field">
              <span>Title / kicker</span>
              <input defaultValue={runtime.settings.title} name="title" />
            </label>
            <label className="field">
              <span>Main headline</span>
              <textarea defaultValue={runtime.settings.subtitle} name="subtitle" />
            </label>
            <label className="field">
              <span>Weekly target</span>
              <input defaultValue={runtime.settings.weeklyTarget} min={1} name="weeklyTarget" type="number" />
            </label>
            <button className="button button-primary" type="submit">
              Save board settings
            </button>
          </form>
        </article>

        <article className="focus-control-card">
          <div className="split-header">
            <div>
              <p className="eyebrow">Add a goal</p>
              <h2>New weekly challenge</h2>
            </div>
          </div>

          <form action={addFocusBoardTaskAction} className="focus-control-form">
            <input name="adminSlug" type="hidden" value={runtime.settings.adminSlug} />
            <div className="focus-control-two-up">
              <label className="field">
                <span>Goal title</span>
                <input name="title" placeholder="Example: Ask for referrals" required />
              </label>
              <label className="field">
                <span>Badge text</span>
                <input name="icon" placeholder="REF" />
              </label>
            </div>
            <label className="field">
              <span>Description / help text</span>
              <textarea
                name="description"
                placeholder="What counts as completing this one?"
                required
              />
            </label>
            <div className="focus-control-three-up">
              <label className="field">
                <span>Metric label</span>
                <input name="metricLabel" placeholder="Asked" required />
              </label>
              <label className="field">
                <span>Target</span>
                <input defaultValue={1} min={0} name="target" type="number" />
              </label>
              <label className="field">
                <span>Points each</span>
                <input defaultValue={5} name="points" type="number" />
              </label>
            </div>
            <div className="focus-control-three-up">
              <label className="field">
                <span>Kind</span>
                <select className="select-field" defaultValue="count" name="kind">
                  <option value="count">Count</option>
                  <option value="toggle">Toggle</option>
                </select>
              </label>
              <label className="field">
                <span>Sticker path (optional)</span>
                <input name="stickerSrc" placeholder="/focus/mascot-rainbow.svg" />
              </label>
              <label className="field">
                <span>Sticker alt (optional)</span>
                <input name="stickerAlt" placeholder="Custom goal sticker" />
              </label>
            </div>
            <button className="button button-primary" type="submit">
              Add weekly goal
            </button>
          </form>
        </article>
      </section>

      <section className="focus-control-stack">
        <article className="focus-control-card">
          <div className="split-header">
            <div>
              <p className="eyebrow">Goals</p>
              <h2>Existing weekly challenges</h2>
            </div>
          </div>

          <div className="focus-control-stack">
            <FocusControlExistingGoals
              adminSlug={runtime.settings.adminSlug}
              tasks={runtime.allTasks}
            />
          </div>
        </article>

        <article className="focus-control-card">
          <div className="split-header">
            <div>
              <p className="eyebrow">Prizes</p>
              <h2>Reward ladder</h2>
            </div>
          </div>

          <div className="focus-control-stack">
            {runtime.rewards.map((reward) => (
              <form action={updateFocusRewardTierAction} className="focus-control-reward-row" key={reward.id ?? reward.label}>
                <input name="adminSlug" type="hidden" value={runtime.settings.adminSlug} />
                <input name="rewardId" type="hidden" value={reward.id} />
                <div className="focus-control-two-up">
                  <label className="field">
                    <span>Reward label</span>
                    <input defaultValue={reward.label} name="label" />
                  </label>
                  <label className="field">
                    <span>Sticker alt</span>
                    <input defaultValue={reward.stickerAlt} name="stickerAlt" />
                  </label>
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea defaultValue={reward.description} name="description" />
                </label>
                <div className="focus-control-three-up">
                  <label className="field">
                    <span>Min points</span>
                    <input defaultValue={reward.minPoints} min={0} name="minPoints" type="number" />
                  </label>
                  <label className="field">
                    <span>Min weeks hit</span>
                    <input defaultValue={reward.minWeeksHit} min={0} name="minWeeksHit" type="number" />
                  </label>
                </div>
                <div className="focus-control-two-up">
                  <label className="field">
                    <span>Locked image path</span>
                    <input defaultValue={reward.lockedStickerSrc} name="lockedStickerSrc" />
                  </label>
                  <label className="field">
                    <span>Unlocked image path</span>
                    <input defaultValue={reward.unlockedStickerSrc} name="unlockedStickerSrc" />
                  </label>
                </div>
                <button className="button button-secondary" type="submit">
                  Save prize
                </button>
              </form>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
