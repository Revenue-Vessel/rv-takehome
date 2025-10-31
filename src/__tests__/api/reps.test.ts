import { createOrUpdateRep, getAllReps, getRepById, deleteRep } from '../../lib/persistence/reps';

describe('Rep Persistence', () => {
  let createdId: number;

  it('should create a new rep', async () => {
    const rep = await createOrUpdateRep({ name: 'Alice', assigned_territories: [1,2] });
    expect(rep.id).toBeDefined();
    createdId = rep.id;
    expect(rep.name).toBe('Alice');
  });

  it('should get all reps', async () => {
    const reps = await getAllReps();
    expect(Array.isArray(reps)).toBe(true);
    expect(reps.length).toBeGreaterThan(0);
  });

  it('should get a rep by id', async () => {
    const rep = await getRepById(createdId);
    expect(rep).toBeDefined();
    expect(rep?.id).toBe(createdId);
  });

  it('should delete a rep', async () => {
    await deleteRep(createdId);
    const rep = await getRepById(createdId);
    expect(rep).toBeNull();
  });
}); 