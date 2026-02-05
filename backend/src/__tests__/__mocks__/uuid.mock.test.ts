import { v4 as uuidv4 } from 'uuid';

describe('uuid mock', () => {
  it('returns fixed uuid', () => {
    expect(uuidv4()).toBe('test-uuid-1234-5678-90ab-cdef');
  });
});
